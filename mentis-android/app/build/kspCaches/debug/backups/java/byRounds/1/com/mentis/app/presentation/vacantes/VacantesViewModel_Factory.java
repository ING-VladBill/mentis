package com.mentis.app.presentation.vacantes;

import com.mentis.app.domain.usecase.ObtenerVacantesPublicasUseCase;
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
public final class VacantesViewModel_Factory implements Factory<VacantesViewModel> {
  private final Provider<ObtenerVacantesPublicasUseCase> obtenerVacantesPublicasUseCaseProvider;

  public VacantesViewModel_Factory(
      Provider<ObtenerVacantesPublicasUseCase> obtenerVacantesPublicasUseCaseProvider) {
    this.obtenerVacantesPublicasUseCaseProvider = obtenerVacantesPublicasUseCaseProvider;
  }

  @Override
  public VacantesViewModel get() {
    return newInstance(obtenerVacantesPublicasUseCaseProvider.get());
  }

  public static VacantesViewModel_Factory create(
      Provider<ObtenerVacantesPublicasUseCase> obtenerVacantesPublicasUseCaseProvider) {
    return new VacantesViewModel_Factory(obtenerVacantesPublicasUseCaseProvider);
  }

  public static VacantesViewModel newInstance(
      ObtenerVacantesPublicasUseCase obtenerVacantesPublicasUseCase) {
    return new VacantesViewModel(obtenerVacantesPublicasUseCase);
  }
}
