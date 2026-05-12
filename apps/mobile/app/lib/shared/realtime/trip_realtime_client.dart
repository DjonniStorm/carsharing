import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';
import '../storage/secure_token_storage.dart';
import 'trip_realtime_contract.dart';

class TripRealtimeClient {
  TripRealtimeClient(this._tokenStorage);

  final SecureTokenStorage _tokenStorage;
  io.Socket? _socket;

  final _events = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get events => _events.stream;

  Future<void> connect() async {
    if (_socket != null) return;

    final token = await _tokenStorage.readAccessToken();
    if (token == null || token.isEmpty) {
      throw StateError('No access token for socket connection');
    }

    final socket = io.io(
      '${AppConfig.socketBaseUrl}/trip',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    void forward(String eventName) {
      socket.on(eventName, (data) {
        if (data is Map) {
          _events.add({
            'event': eventName,
            ...data.map((k, v) => MapEntry(k.toString(), v)),
          });
        } else {
          _events.add({'event': eventName, 'data': data});
        }
      });
    }

    forward(TripWsEvent.connectionReady);
    forward(TripWsEvent.subscriptionOk);
    forward(TripWsEvent.subscriptionError);
    forward(TripWsEvent.tripStateChanged);
    forward(TripWsEvent.tripMetricsUpdated);
    forward(TripWsEvent.tripRoutePoint);
    forward(TripWsEvent.tripFinished);
    forward(TripWsEvent.tripWarning);
    forward(TripWsEvent.tripError);
    forward(TripWsEvent.carStateChanged);
    forward(TripWsEvent.carLocationUpdated);
    forward(TripWsEvent.fleetSummaryUpdated);
    forward(TripWsEvent.telemetryReceived);
    forward(TripWsEvent.telemetryTimeout);
    forward(TripWsEvent.violationCreated);
    forward(TripWsEvent.violationUpdated);

    socket.connect();

    _socket = socket;
  }

  Future<void> disconnect() async {
    final s = _socket;
    if (s == null) return;
    unsubscribeFleet();
    s.dispose();
    _socket = null;
  }

  void subscribeTrip(String tripId) {
    _socket?.emit(TripWsCommand.subscribeTrip, {'tripId': tripId});
  }

  void unsubscribeTrip(String tripId) {
    _socket?.emit(TripWsCommand.unsubscribeTrip, {'tripId': tripId});
  }

  /// Комната `fleet`: те же события позиций (`car.location.updated`), что видит веб-дашборд.
  void subscribeFleet() {
    _socket?.emit(TripWsCommand.subscribeFleet, <String, dynamic>{});
  }

  void unsubscribeFleet() {
    _socket?.emit(TripWsCommand.unsubscribeFleet, <String, dynamic>{});
  }
}

