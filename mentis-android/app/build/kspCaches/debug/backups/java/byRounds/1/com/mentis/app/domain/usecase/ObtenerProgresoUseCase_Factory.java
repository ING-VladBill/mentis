package com.mentis.app.domain.usecase;

import com.mentis.app.domain.repository.ProgresoRepository;
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
public final class ObtenerProgresoUseCase_Factory implements Factory<ObtenerProgresoUseCase> {
  private final Provider<ProgresoRepository> progresoRepositoryProvider;

  public ObtenerProgresoUseCase_Factory(Provider<ProgresoRepository> progresoRepositoryProvider) {
    this.progresoRepositoryProvider = progresoRepositoryProvider;
  }

  @Override
  public ObtenerProgresoUseCase get() {
    return newInstance(progresoRepositoryProvider.get());
  }

  public static ObtenerProgresoUseCase_Factory create(
      Provider<ProgresoRepository> progresoRepositoryProvider) {
    return new ObtenerProgresoUseCase_Factory(progresoRepositoryProvider);
  }

  public static ObtenerProgresoUseCase newInstance(ProgresoRepository progresoRepository) {
    return new ObtenerProgresoUseCase(progresoRepository);
  }
}
