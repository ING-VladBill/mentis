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
public final class FinalizarExamenUseCase_Factory implements Factory<FinalizarExamenUseCase> {
  private final Provider<ExamenRepository> examenRepositoryProvider;

  public FinalizarExamenUseCase_Factory(Provider<ExamenRepository> examenRepositoryProvider) {
    this.examenRepositoryProvider = examenRepositoryProvider;
  }

  @Override
  public FinalizarExamenUseCase get() {
    return newInstance(examenRepositoryProvider.get());
  }

  public static FinalizarExamenUseCase_Factory create(
      Provider<ExamenRepository> examenRepositoryProvider) {
    return new FinalizarExamenUseCase_Factory(examenRepositoryProvider);
  }

  public static FinalizarExamenUseCase newInstance(ExamenRepository examenRepository) {
    return new FinalizarExamenUseCase(examenRepository);
  }
}
