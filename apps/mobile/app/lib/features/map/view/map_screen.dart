import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

import '../../../app/router/app_routes.dart';
import '../cubit/map_cubit.dart';
import '../cubit/map_state.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  @override
  void initState() {
    super.initState();
    // ignore: discarded_futures
    context.read<MapCubit>().init();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: BlocBuilder<MapCubit, MapState>(
              builder: (context, state) {
                final objects = <MapObject>[
                  for (final car in state.cars.values)
                    if (car.lat != null && car.lon != null)
                      CircleMapObject(
                        mapId: MapObjectId('car-${car.id}'),
                        circle: Circle(
                          center: Point(latitude: car.lat!, longitude: car.lon!),
                          radius: 16,
                        ),
                        strokeColor: const Color(0xFF8B5CF6),
                        fillColor: const Color(0x668B5CF6),
                        strokeWidth: 3,
                        zIndex: 10,
                      ),
                ];

                return YandexMap(
                  mapObjects: objects,
                  onMapCreated: (c) async {
                    await c.moveCamera(
                      CameraUpdate.newCameraPosition(
                        const CameraPosition(
                          target: Point(
                            latitude: 55.751244,
                            longitude: 37.618423,
                          ),
                          zoom: 12,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 12,
            right: 12,
            child: _AvatarButton(
              letter: 'A',
              onTap: () => context.push(AppRoutes.profile),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(
                left: 12,
                right: 12,
                bottom: MediaQuery.paddingOf(context).bottom + 12,
              ),
              child: _ActiveTripCard(),
            ),
          ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 12,
            left: 12,
            child: BlocBuilder<MapCubit, MapState>(
              builder: (context, s) {
                if (!s.loading) return const SizedBox.shrink();
                return const Card(
                  child: Padding(
                    padding: EdgeInsets.all(8),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveTripCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'map.active_trip'.tr(),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text('map.trip_stub'.tr()),
                ],
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: () {},
              child: const Text('...'),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvatarButton extends StatelessWidget {
  const _AvatarButton({
    required this.letter,
    required this.onTap,
  });

  final String letter;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: CircleAvatar(
        radius: 22,
        backgroundColor: const Color(0xFF6D28D9),
        child: Text(
          letter,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
    );
  }
}

