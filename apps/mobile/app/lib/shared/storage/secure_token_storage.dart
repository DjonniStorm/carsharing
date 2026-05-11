import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStorage {
  SecureTokenStorage(this._storage);

  final FlutterSecureStorage _storage;
  final _changes = StreamController<void>.broadcast();

  static const _kAccessTokenKey = 'access_token';

  Stream<void> get changes => _changes.stream;

  Future<void> writeAccessToken(String token) async {
    await _storage.write(key: _kAccessTokenKey, value: token);
    _changes.add(null);
  }

  Future<String?> readAccessToken() async {
    return _storage.read(key: _kAccessTokenKey);
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccessTokenKey);
    _changes.add(null);
  }
}

