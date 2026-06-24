#import "SRLoginViewController.h"

%ctor {
    // Wait for the root view controller to be ready, then present login
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
        [SRLoginViewController presentIfNeeded];
    });
}
