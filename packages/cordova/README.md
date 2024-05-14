# @padloc/cordova

Checkout how to setup cordova platform for
[Android](https://cordova.apache.org/docs/en/12.x/guide/platforms/android/index.html)
and
[IOS](https://cordova.apache.org/docs/en/12.x/guide/platforms/ios/index.html).
Make sure to install packages for cordova-android 12.0.x version and cordova-ios
6.x version.

## Android Setup

Install Gradel 7.6.4 version and Java 17 (java-17-openjdk)

Setup following Environment: - For Linux:

```sh
# Android SDK
export ANDROID_HOME=/<path to android installation>/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools/
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin/
export PATH=$PATH:$ANDROID_HOME/build-tools/
export PATH=$PATH:$ANDROID_HOME/emulator/
export CORDOVA_JAVA_HOME=/<path to java 17>/
# Gradle
export PATH=$PATH:/<path to gradel-7.6.4>/bin
```

For Windows: Please help yourself to google search how to set environment on
Windows.

```
ANDROID_HOME=/<path to android installation>/Sdk
CORDOVA_JAVA_HOME=/<path to java 17>/
Path=%path%;%ANDROID_HOME%\platform-tools\;%ANDROID_HOME%\cmdline-tools\latest\bin\;%ANDROID_HOME%\build-tools\;%ANDROID_HOME%\emulator\;<path to gradel-7.6.4>\bin
```

Once, everything is setup, build android app.... Finger's cross

```sh
npm run setup_build:android
```

## IOS Setup

I don't have any info. Someone can help me on this... <3
