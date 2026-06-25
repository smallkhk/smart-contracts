#import "SRLoginViewController.h"
#import <mach-o/dyld.h>
#import <dlfcn.h>
#import <substrate.h>

// StateScript.dylib offsets from binary analysis
#define SS_CHECK_AUTH_OFFSET  0x3a1b0   // Auth::CheckAuthStatusInBackground()
#define SS_AUTH_STATUS_OFFSET 0x352628  // Auth::authStatus variable

static void (*orig_CheckAuth)(void) = NULL;

// Replacement: skip server check, write authStatus = 1 (authenticated)
static void hooked_CheckAuth(void) {
    uint32_t count = _dyld_image_count();
    for (uint32_t i = 0; i < count; i++) {
        const char *name = _dyld_get_image_name(i);
        if (name && strstr(name, "StateScript")) {
            uintptr_t base = (uintptr_t)_dyld_get_image_header(i);
            *(volatile uint32_t *)(base + SS_AUTH_STATUS_OFFSET) = 1;
            return;
        }
    }
}

static void onImageAdded(const struct mach_header *mh, intptr_t slide) {
    Dl_info info;
    if (!dladdr(mh, &info) || !info.dli_fname) return;
    if (!strstr(info.dli_fname, "StateScript")) return;

    uintptr_t base = (uintptr_t)mh;

    // Hook CheckAuthStatusInBackground → our bypass
    void *target = (void *)(base + SS_CHECK_AUTH_OFFSET);
    MSHookFunction(target, (void *)hooked_CheckAuth, (void **)&orig_CheckAuth);

    // Immediately patch authStatus = 1 in case it was already set
    *(volatile uint32_t *)(base + SS_AUTH_STATUS_OFFSET) = 1;

    // Also mark auth animation as seen so StateScript skips its intro screen
    dispatch_async(dispatch_get_main_queue(), ^{
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"HasSeenAuthAnim_V1"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    });
}

%ctor {
    // Hook StateScript whenever it loads (fires immediately if already loaded)
    _dyld_register_func_for_add_image(onImageAdded);

    // Show our key screen
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
        [SRLoginViewController presentIfNeeded];
    });
}
