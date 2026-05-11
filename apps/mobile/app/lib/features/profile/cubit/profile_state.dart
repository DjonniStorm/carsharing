import 'package:equatable/equatable.dart';

import '../domain/profile_user.dart';

sealed class ProfileState extends Equatable {
  const ProfileState();

  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {
  const ProfileInitial();
}

class ProfileLoading extends ProfileState {
  const ProfileLoading();
}

class ProfileLoaded extends ProfileState {
  const ProfileLoaded(this.user);
  final ProfileUser user;

  @override
  List<Object?> get props => [user.id, user.name, user.email, user.phone, user.role];
}

class ProfileLoadError extends ProfileState {
  const ProfileLoadError(this.message);
  final String message;

  @override
  List<Object?> get props => [message];
}

class ProfileUpdateError extends ProfileState {
  const ProfileUpdateError({required this.user, required this.message});
  final ProfileUser user;
  final String message;

  @override
  List<Object?> get props => [user.id, message];
}

class ProfileUpdated extends ProfileState {
  const ProfileUpdated(this.user);
  final ProfileUser user;

  @override
  List<Object?> get props => [user.id, user.name, user.email, user.phone, user.role];
}

