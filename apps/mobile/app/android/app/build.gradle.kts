import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Читаем секреты из android/local.properties (этот файл в .gitignore).
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

// Снимаем возможные обрамляющие кавычки, чтобы значение в манифесте было чистым.
val yandexMapKitApiKey: String = (
    localProps.getProperty("YANDEX_MAPKIT_API_KEY")
        ?: (project.findProperty("YANDEX_MAPKIT_API_KEY") as String?)
        ?: ""
    ).trim().trim('"')

android {
    namespace = "com.example.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    buildFeatures {
        // BuildConfig нужен, чтобы Kotlin-код (MainApplication) получил ключ.
        buildConfig = true
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        // yandex_mapkit требует minSdk 26+
        minSdk = 26
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        buildConfigField("String", "YANDEX_MAPKIT_API_KEY", "\"$yandexMapKitApiKey\"")
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

dependencies {
    // Нативная либа Yandex MapKit. Без этой строки Kotlin не видит
    // `com.yandex.mapkit.MapKitFactory`. Вариант `lite` — как в доке плагина.
    implementation("com.yandex.android:maps.mobile:4.22.0-lite")
}

flutter {
    source = "../.."
}
