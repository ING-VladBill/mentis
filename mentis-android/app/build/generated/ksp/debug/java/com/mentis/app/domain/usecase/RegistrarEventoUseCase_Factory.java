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
public final class RegistrarEventoUseCase_Factory implements Factory<RegistrarEventoUseCase> {
  private final Provider<ExamenRepository> examenRepositoryProvider;

  public RegistrarEventoUseCase_Factory(Provider<ExamenRepository> examenRepositoryProvider) {
    this.examenRepositoryProvider = examenRepositoryProvider;
  }

  @Override
  public RegistrarEventoUseCase get() {
    return newInstance(examenRepositoryProvider.get());
  }

  public static RegistrarEventoUseCase_Factory create(
      Provider<ExamenRepository> examenRepositoryProvider) {
    return new RegistrarEventoUseCase_Factory(examenRepositoryProvider);
  }

  public static RegistrarEventoUseCase newInstance(ExamenRepository examenRepository) {
    return new RegistrarEventoUseCase(examenRepository);
  }
}
