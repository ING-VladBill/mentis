package com.mentis.app.domain.usecase;

import com.mentis.app.domain.repository.VacantesRepository;
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
public final class ObtenerVacantesPublicasUseCase_Factory implements Factory<ObtenerVacantesPublicasUseCase> {
  private final Provider<VacantesRepository> vacantesRepositoryProvider;

  public ObtenerVacantesPublicasUseCase_Factory(
      Provider<VacantesRepository> vacantesRepositoryProvider) {
    this.vacantesRepositoryProvider = vacantesRepositoryProvider;
  }

  @Override
  public ObtenerVacantesPublicasUseCase get() {
    return newInstance(vacantesRepositoryProvider.get());
  }

  public static ObtenerVacantesPublicasUseCase_Factory create(
      Provider<VacantesRepository> vacantesRepositoryProvider) {
    return new ObtenerVacantesPublicasUseCase_Factory(vacantesRepositoryProvider);
  }

  public static ObtenerVacantesPublicasUseCase newInstance(VacantesRepository vacantesRepository) {
    return new ObtenerVacantesPublicasUseCase(vacantesRepository);
  }
}
