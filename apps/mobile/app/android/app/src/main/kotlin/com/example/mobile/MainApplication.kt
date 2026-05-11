package com.example.mobile

import com.yandex.mapkit.MapKitFactory
import io.flutter.app.FlutterApplication

/**
 * Кастомный Application нужен Yandex MapKit: ключ должен быть выставлен до
 * первой попытки создать YandexMap-виджет, иначе плагин не зарегистрирует
 * платформенный view и упадёт с "Trying to create a platform view of
 * unregistered type: yandex_mapkit/yandex_map".
 */
class MainApplication : FlutterApplication() {
    override fun onCreate() {
        super.onCreate()
        MapKitFactory.setApiKey(BuildConfig.YANDEX_MAPKIT_API_KEY)
    }
}
