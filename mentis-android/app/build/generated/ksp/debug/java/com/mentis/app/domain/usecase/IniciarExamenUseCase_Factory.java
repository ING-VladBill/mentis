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
public final class IniciarExamenUseCase_Factory implements Factory<IniciarExamenUseCase> {
  private final Provider<ExamenRepository> examenRepositoryProvider;

  public IniciarExamenUseCase_Factory(Provider<ExamenRepository> examenRepositoryProvider) {
    this.examenRepositoryProvider = examenRepositoryProvider;
  }

  @Override
  public IniciarExamenUseCase get() {
    return newInstance(examenRepositoryProvider.get());
  }

  public static IniciarExamenUseCase_Factory create(
      Provider<ExamenRepository> examenRepositoryProvider) {
    return new IniciarExamenUseCase_Factory(examenRepositoryProvider);
  }

  public static IniciarExamenUseCase newInstance(ExamenRepository examenRepository) {
    return new IniciarExamenUseCase(examenRepository);
  }
}
