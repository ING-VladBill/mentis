package com.mentis.app.domain.usecase;

import com.mentis.app.domain.repository.ExamenRepository;
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
public final class ObtenerEstadoExamenUseCase_Factory implements Factory<ObtenerEstadoExamenUseCase> {
  private final Provider<ExamenRepository> examenRepositoryProvider;

  public ObtenerEstadoExamenUseCase_Factory(Provider<ExamenRepository> examenRepositoryProvider) {
    this.examenRepositoryProvider = examenRepositoryProvider;
  }

  @Override
  public ObtenerEstadoExamenUseCase get() {
    return newInstance(examenRepositoryProvider.get());
  }

  public static ObtenerEstadoExamenUseCase_Factory create(
      Provider<ExamenRepository> examenRepositoryProvider) {
    return new ObtenerEstadoExamenUseCase_Factory(examenRepositoryProvider);
  }

  public static ObtenerEstadoExamenUseCase newInstance(ExamenRepository examenRepository) {
    return new ObtenerEstadoExamenUseCase(examenRepository);
  }
}
