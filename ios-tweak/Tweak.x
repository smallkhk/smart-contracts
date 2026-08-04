#import "SRLoginViewController.h"
#import <mach-o/dyld.h>
#import <dlfcn.h>
#import <substrate.h>
#import <UIKit/UIKit.h>

// StateScript 1.3.3 — verified offsets from symbol table
#define SS_SJINIBYSVEV_OFFSET     0x6732c   // sjinibysvEv() — auth-status check in render loop
#define SS_ARM_TAMPER_OFFSET      0x11fb8   // ArmTamperCrash()
#define SS_ARM_TAMPER_FAST_OFFSET 0xb548c   // ArmTamperCrashFast()
#define SS_POLL_TAMPER_OFFSET     0xa61b4   // PollTamperCrash()
#define SS_SEC_CORE_POLL_OFFSET   0xa63fc   // SecurityCorePoll()
#define SS_ENFORCE_ANTI_OFFSET    0xa6738   // EnforceAntiForce()
#define SS_XRUZTGODM_OFFSET       0x10f10   // login trigger
#define SS_DEEP_VERIFY_OFFSET     0x1b138   // DeepVerifySession()
#define SS_DEAUTH_OFFSET          0x1d570   // DeauthenticateUser()
#define SS_INVWYAUYIAO_OFFSET     0x1e274   // auth-poll loop
#define SS_AUTHORIZE_UI_OFFSET    0xcfef4   // AuthorizeUiFrame()
#define SS_AUTH_GATE_OFFSET       0x28b778  // _authGate (BSS)

// Return-1 stub: used wherever a function must return "authenticated/true"
static uint64_t ss_return_true(void) { return 1; }

// No-op stub: used to silence tamper/deauth functions
static void ss_noop(void) {}

static void (*orig_sjinibysvEv)(void)    = NULL;
static void (*orig_ArmTamper)(void)      = NULL;
static void (*orig_ArmTamperFast)(void)  = NULL;
static void (*orig_PollTamper)(void)     = NULL;
static void (*orig_SecCorePoll)(void)    = NULL;
static void (*orig_EnforceAnti)(void)    = NULL;
static void (*orig_xruztgodm)(void)      = NULL;
static void (*orig_DeepVerify)(void)     = NULL;
static void (*orig_Deauth)(void)         = NULL;
static void (*orig_AuthPoll)(void)       = NULL;
static void (*orig_AuthorizeUi)(void)    = NULL;

static void onImageAdded(const struct mach_header *mh, intptr_t slide) {
    Dl_info info;
    if (!dladdr(mh, &info) || !info.dli_fname) return;
    if (!strstr(info.dli_fname, "StateScript")) return;

    uintptr_t base = (uintptr_t)mh;

    // 1. Kill anti-tamper first so subsequent hooks don't trigger crashes
    MSHookFunction((void *)(base + SS_POLL_TAMPER_OFFSET),     (void *)ss_noop, (void **)&orig_PollTamper);
    MSHookFunction((void *)(base + SS_ARM_TAMPER_OFFSET),      (void *)ss_noop, (void **)&orig_ArmTamper);
    MSHookFunction((void *)(base + SS_ARM_TAMPER_FAST_OFFSET), (void *)ss_noop, (void **)&orig_ArmTamperFast);
    MSHookFunction((void *)(base + SS_ENFORCE_ANTI_OFFSET),    (void *)ss_noop, (void **)&orig_EnforceAnti);
    MSHookFunction((void *)(base + SS_SEC_CORE_POLL_OFFSET),   (void *)ss_noop, (void **)&orig_SecCorePoll);

    // 2. Hook sjinibysvEv — the render-loop auth check; returning 1 = "authenticated"
    //    This is what controls whether the login ImGui window appears each frame
    MSHookFunction((void *)(base + SS_SJINIBYSVEV_OFFSET), (void *)ss_return_true, (void **)&orig_sjinibysvEv);

    // 3. NOP all other auth/deauth paths
    MSHookFunction((void *)(base + SS_XRUZTGODM_OFFSET),    (void *)ss_noop, (void **)&orig_xruztgodm);
    MSHookFunction((void *)(base + SS_DEEP_VERIFY_OFFSET),  (void *)ss_noop, (void **)&orig_DeepVerify);
    MSHookFunction((void *)(base + SS_DEAUTH_OFFSET),       (void *)ss_noop, (void **)&orig_Deauth);
    MSHookFunction((void *)(base + SS_INVWYAUYIAO_OFFSET),  (void *)ss_noop, (void **)&orig_AuthPoll);
    MSHookFunction((void *)(base + SS_AUTHORIZE_UI_OFFSET), (void *)ss_noop, (void **)&orig_AuthorizeUi);

    // 4. Write _authGate = 1 in BSS
    *(volatile uint32_t *)(base + SS_AUTH_GATE_OFFSET) = 1;

    // 5. NSUserDefaults flags to skip intro/welcome screens
    dispatch_async(dispatch_get_main_queue(), ^{
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"HasSeenAuthAnim_V1"];
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"HasSeenWelcome_V1"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    });
}

// Hook the ObjC login prompt — makes promptInput immediately return YES
// without rendering the Discord login ImGui window
%hook mtgtsagac
- (BOOL)promptInput:(id)prompt buffer:(char *)buffer maxSize:(int)maxSize isPassword:(BOOL)isPassword {
    if (buffer && maxSize > 0) buffer[0] = '\0';
    return YES;
}
%end

// Hook OneScript ModMenu login — redirect to our Vercel auth endpoint
static NSString *const kLoginURL = @"https://noratq.vercel.app/api/login";

%hook ModMenu
- (void)LoginWithUsername:(NSString *)username Password:(NSString *)password Completion:(void(^)(BOOL, NSString *))completion {
    if (!username.length || !password.length) {
        if (completion) completion(NO, @"Username and password required");
        return;
    }

    NSURL *url = [NSURL URLWithString:kLoginURL];
    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url
                                                       cachePolicy:NSURLRequestReloadIgnoringCacheData
                                                   timeoutInterval:10];
    req.HTTPMethod = @"POST";
    [req setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    req.HTTPBody = [NSJSONSerialization dataWithJSONObject:@{
        @"username": username,
        @"password": password
    } options:0 error:nil];

    [[[NSURLSession sharedSession] dataTaskWithRequest:req
        completionHandler:^(NSData *data, NSURLResponse *resp, NSError *err) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (err || !data) {
                    if (completion) completion(NO, @"Cannot reach server");
                    return;
                }
                NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
                BOOL valid = [json[@"valid"] boolValue];
                NSString *reason = json[@"reason"] ?: (valid ? @"" : @"Login failed");
                if (completion) completion(valid, reason);
            });
    }] resume];
}
%end

%ctor {
    _dyld_register_func_for_add_image(onImageAdded);

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
        [SRLoginViewController presentIfNeeded];
    });
}
