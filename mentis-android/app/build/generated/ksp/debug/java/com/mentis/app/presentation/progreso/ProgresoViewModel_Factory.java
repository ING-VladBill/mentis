package com.mentis.app.presentation.progreso;

import com.mentis.app.domain.repository.AuthRepository;
import com.mentis.app.domain.usecase.ObtenerProgresoUseCase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class ProgresoViewModel_Factory implements Factory<ProgresoViewModel> {
  private final Provider<ObtenerProgresoUseCase> obtenerProgresoUseCaseProvider;

  private final Provider<AuthRepository> authRepositoryProvider;

  public ProgresoViewModel_Factory(Provider<ObtenerProgresoUseCase> obtenerProgresoUseCaseProvider,
      Provider<AuthRepository> authRepositoryProvider) {
    this.obtenerProgresoUseCaseProvider = obtenerProgresoUseCaseProvider;
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public ProgresoViewModel get() {
    return newInstance(obtenerProgresoUseCaseProvider.get(), authRepositoryProvider.get());
  }

  public static ProgresoViewModel_Factory create(
      Provider<ObtenerProgresoUseCase> obtenerProgresoUseCaseProvider,
      Provider<AuthRepository> authRepositoryProvider) {
    return new ProgresoViewModel_Factory(obtenerProgresoUseCaseProvider, authRepositoryProvider);
  }

  public static ProgresoViewModel newInstance(ObtenerProgresoUseCase obtenerProgresoUseCase,
      AuthRepository authRepository) {
    return new ProgresoViewModel(obtenerProgresoUseCase, authRepository);
  }
}
