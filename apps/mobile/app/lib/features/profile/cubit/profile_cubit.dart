import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../data/profile_repository.dart';
import '../domain/profile_user.dart';
import 'profile_state.dart';

class ProfileCubit extends Cubit<ProfileState> {
  ProfileCubit(this._repository) : super(const ProfileInitial());

  final ProfileRepository _repository;

  Future<void> load() async {
    emit(const ProfileLoading());
    try {
      final user = await _repository.me();
      emit(ProfileLoaded(user));
    } on DioException catch (e) {
      emit(ProfileLoadError(e.message ?? 'Network error'));
    } catch (e) {
      emit(ProfileLoadError(e.toString()));
    }
  }

  Future<void> updateName(String name) async {
    final s = _currentUser();
    if (s == null) return;
    emit(const ProfileLoading());
    try {
      await _repository.updateName(id: s.id, name: name);
      final fresh = await _repository.me();
      emit(ProfileUpdated(fresh));
      emit(ProfileLoaded(fresh));
    } on DioException catch (e) {
      emit(ProfileUpdateError(user: s, message: e.message ?? 'Network error'));
      emit(ProfileLoaded(s));
    } catch (e) {
      emit(ProfileUpdateError(user: s, message: e.toString()));
      emit(ProfileLoaded(s));
    }
  }

  ProfileUser? _currentUser() {
    final s = state;
    if (s is ProfileLoaded) return s.user;
    if (s is ProfileUpdated) return s.user;
    if (s is ProfileUpdateError) return s.user;
    return null;
  }
}

