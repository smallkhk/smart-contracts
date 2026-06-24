ARCHS = arm64 arm64e
TARGET = iphone:clang:latest:14.0
INSTALL_TARGET_PROCESSES = SecurityDemoApp

include $(THEOS)/makefiles/common.mk

TWEAK_NAME = SilkRoadLogin
SilkRoadLogin_FILES = Tweak.x SRLoginViewController.m
SilkRoadLogin_FRAMEWORKS = UIKit Foundation
SilkRoadLogin_CFLAGS = -fobjc-arc

include $(THEOS)/makefiles/tweak.mk
