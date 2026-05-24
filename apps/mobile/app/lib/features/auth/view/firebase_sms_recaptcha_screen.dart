import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Полноэкранная reCAPTCHA для Firebase Phone Auth (SMS).
class FirebaseSmsRecaptchaScreen extends StatefulWidget {
  const FirebaseSmsRecaptchaScreen({
    super.key,
    required this.siteKey,
  });

  final String siteKey;

  static Future<String?> open(BuildContext context, {required String siteKey}) {
    return Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => FirebaseSmsRecaptchaScreen(siteKey: siteKey),
      ),
    );
  }

  @override
  State<FirebaseSmsRecaptchaScreen> createState() =>
      _FirebaseSmsRecaptchaScreenState();
}

class _FirebaseSmsRecaptchaScreenState extends State<FirebaseSmsRecaptchaScreen> {
  late final WebViewController _controller;
  late final TransformationController _transformController;

  var _loaded = false;
  var _initialScaleApplied = false;
  double _scale = 1;

  static const _minScale = 0.55;
  static const _maxScale = 1.8;
  static const _scaleStep = 0.1;

  @override
  void initState() {
    super.initState();
    _transformController = TransformationController()
      ..addListener(_syncScaleFromTransform);
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..addJavaScriptChannel(
        'Recaptcha',
        onMessageReceived: (message) {
          final token = message.message.trim();
          if (!mounted) return;
          Navigator.of(context).pop(token.isEmpty ? null : token);
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loaded = true);
          },
        ),
      )
      ..loadHtmlString(
        _buildHtml(widget.siteKey),
        baseUrl: 'https://127.0.0.1/',
      );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialScaleApplied) return;
    _initialScaleApplied = true;

    final width = MediaQuery.sizeOf(context).width;
    if (width < 420) {
      _setScale(0.82);
    }
  }

  @override
  void dispose() {
    _transformController.removeListener(_syncScaleFromTransform);
    _transformController.dispose();
    super.dispose();
  }

  void _syncScaleFromTransform() {
    final next = _transformController.value.getMaxScaleOnAxis();
    if ((next - _scale).abs() < 0.01) return;
    setState(() => _scale = next);
  }

  void _setScale(double scale) {
    final next = scale.clamp(_minScale, _maxScale);
    setState(() => _scale = next);
    _transformController.value = Matrix4.diagonal3Values(next, next, 1);
  }

  String _buildHtml(String siteKey) {
    final encodedKey = jsonEncode(siteKey);
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4, user-scalable=yes">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      overflow: auto;
      background: #fff;
      -webkit-overflow-scrolling: touch;
    }
    #main {
      box-sizing: border-box;
      width: 100%;
      max-width: 360px;
      margin: 0 auto;
      padding: 12px 8px 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #status {
      color: #666;
      margin-bottom: 12px;
      text-align: center;
      font-family: sans-serif;
      font-size: 14px;
    }
    #recaptcha {
      width: 100%;
      display: flex;
      justify-content: center;
      overflow: visible;
    }
    iframe {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div id="main">
    <div id="status">Loading reCAPTCHA…</div>
    <div id="recaptcha"></div>
  </div>
  <script>
    const siteKey = $encodedKey;

    function renderRecaptcha() {
      document.getElementById('status').textContent = '';
      grecaptcha.render('recaptcha', {
        sitekey: siteKey,
        size: 'normal',
        callback: function(token) {
          Recaptcha.postMessage(token);
        },
        'expired-callback': function() {
          Recaptcha.postMessage('');
        },
        'error-callback': function() {
          Recaptcha.postMessage('');
        }
      });
    }

    function initRecaptcha() {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        renderRecaptcha();
        return;
      }
      setTimeout(initRecaptcha, 200);
    }

    window.onload = initRecaptcha;
  </script>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    final viewportHeight = MediaQuery.sizeOf(context).height;

    return Scaffold(
      appBar: AppBar(
        title: Text('auth.recaptcha_sms_title'.tr()),
        leading: IconButton(
          tooltip: 'common.cancel'.tr(),
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Text(
              'auth.recaptcha_sms_hint'.tr(),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: Text(
              'auth.recaptcha_zoom_hint'.tr(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Stack(
              children: [
                InteractiveViewer(
                  transformationController: _transformController,
                  minScale: _minScale,
                  maxScale: _maxScale,
                  panEnabled: true,
                  scaleEnabled: true,
                  clipBehavior: Clip.none,
                  boundaryMargin: const EdgeInsets.all(48),
                  child: SizedBox(
                    width: MediaQuery.sizeOf(context).width,
                    height: viewportHeight * 1.15,
                    child: WebViewWidget(controller: _controller),
                  ),
                ),
                if (!_loaded)
                  const Center(child: CircularProgressIndicator()),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Material(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      tooltip: 'auth.recaptcha_zoom_out'.tr(),
                      onPressed: _loaded
                          ? () => _setScale(_scale - _scaleStep)
                          : null,
                      icon: const Icon(Icons.zoom_out),
                    ),
                    Expanded(
                      child: Text(
                        'auth.recaptcha_zoom_level'.tr(
                          namedArgs: {
                            'percent': '${(_scale * 100).round()}',
                          },
                        ),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ),
                    IconButton(
                      tooltip: 'auth.recaptcha_zoom_reset'.tr(),
                      onPressed: _loaded ? () => _setScale(1) : null,
                      icon: const Icon(Icons.fit_screen),
                    ),
                    IconButton(
                      tooltip: 'auth.recaptcha_zoom_in'.tr(),
                      onPressed: _loaded
                          ? () => _setScale(_scale + _scaleStep)
                          : null,
                      icon: const Icon(Icons.zoom_in),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
