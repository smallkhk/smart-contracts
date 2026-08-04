#import "SRLoginViewController.h"
#import <mach-o/dyld.h>
#import <dlfcn.h>
#import <substrate.h>

// StateScript 1.3.3 offsets — verified from symbol table
#define SS_XRUZTGODM_OFFSET       0x10f10   // login trigger (xruztgodmEv)
#define SS_ARM_TAMPER_OFFSET      0x11fb8   // ArmTamperCrash()
#define SS_DEEP_VERIFY_OFFSET     0x1b138   // DeepVerifySession()
#define SS_DEAUTH_OFFSET          0x1d570   // DeauthenticateUser()
#define SS_INVWYAUYIAO_OFFSET     0x1e274   // auth-poll loop (invwyauyiaoEv)
#define SS_POLL_TAMPER_OFFSET     0xa61b4   // PollTamperCrash()
#define SS_SEC_CORE_POLL_OFFSET   0xa63fc   // SecurityCorePoll()
#define SS_ENFORCE_ANTI_OFFSET    0xa6738   // EnforceAntiForce()
#define SS_ARM_TAMPER_FAST_OFFSET 0xb548c   // ArmTamperCrashFast()
#define SS_AUTHORIZE_UI_OFFSET    0xcfef4   // AuthorizeUiFrame()
#define SS_AUTH_GATE_OFFSET       0x28b778  // _authGate (BSS — write 1 at runtime)

static void (*orig_xruztgodm)(void)      = NULL;
static void (*orig_DeepVerify)(void)     = NULL;
static void (*orig_Deauth)(void)         = NULL;
static void (*orig_AuthPoll)(void)       = NULL;
static void (*orig_ArmTamper)(void)      = NULL;
static void (*orig_ArmTamperFast)(void)  = NULL;
static void (*orig_PollTamper)(void)     = NULL;
static void (*orig_SecCorePoll)(void)    = NULL;
static void (*orig_EnforceAnti)(void)    = NULL;
static void (*orig_AuthorizeUi)(void)    = NULL;

// Single no-op stub used for all bypassed functions
static void ss_noop(void) {}

static void onImageAdded(const struct mach_header *mh, intptr_t slide) {
    Dl_info info;
    if (!dladdr(mh, &info) || !info.dli_fname) return;
    if (!strstr(info.dli_fname, "StateScript")) return;

    uintptr_t base = (uintptr_t)mh;

    // Step 1: Silence tamper-crash machinery first so subsequent hooks are safe
    MSHookFunction((void *)(base + SS_POLL_TAMPER_OFFSET),     (void *)ss_noop, (void **)&orig_PollTamper);
    MSHookFunction((void *)(base + SS_ARM_TAMPER_OFFSET),      (void *)ss_noop, (void **)&orig_ArmTamper);
    MSHookFunction((void *)(base + SS_ARM_TAMPER_FAST_OFFSET), (void *)ss_noop, (void **)&orig_ArmTamperFast);
    MSHookFunction((void *)(base + SS_ENFORCE_ANTI_OFFSET),    (void *)ss_noop, (void **)&orig_EnforceAnti);
    MSHookFunction((void *)(base + SS_SEC_CORE_POLL_OFFSET),   (void *)ss_noop, (void **)&orig_SecCorePoll);

    // Step 2: Bypass auth flow — skip login trigger and deep-verify network call
    MSHookFunction((void *)(base + SS_XRUZTGODM_OFFSET),   (void *)ss_noop, (void **)&orig_xruztgodm);
    MSHookFunction((void *)(base + SS_DEEP_VERIFY_OFFSET), (void *)ss_noop, (void **)&orig_DeepVerify);
    MSHookFunction((void *)(base + SS_DEAUTH_OFFSET),      (void *)ss_noop, (void **)&orig_Deauth);
    MSHookFunction((void *)(base + SS_INVWYAUYIAO_OFFSET), (void *)ss_noop, (void **)&orig_AuthPoll);
    MSHookFunction((void *)(base + SS_AUTHORIZE_UI_OFFSET),(void *)ss_noop, (void **)&orig_AuthorizeUi);

    // Step 3: Write _authGate = 1 (marks session as authenticated)
    *(volatile uint32_t *)(base + SS_AUTH_GATE_OFFSET) = 1;

    // Step 4: Suppress Discord intro animation screen
    dispatch_async(dispatch_get_main_queue(), ^{
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"HasSeenAuthAnim_V1"];
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"HasSeenWelcome_V1"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    });
}

%ctor {
    _dyld_register_func_for_add_image(onImageAdded);

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
        [SRLoginViewController presentIfNeeded];
    });
}
