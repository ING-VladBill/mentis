package com.mentis.app.presentation.acceso;

import com.mentis.app.domain.usecase.AccederUseCase;
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
public final class AccesoViewModel_Factory implements Factory<AccesoViewModel> {
  private final Provider<AccederUseCase> accederUseCaseProvider;

  public AccesoViewModel_Factory(Provider<AccederUseCase> accederUseCaseProvider) {
    this.accederUseCaseProvider = accederUseCaseProvider;
  }

  @Override
  public AccesoViewModel get() {
    return newInstance(accederUseCaseProvider.get());
  }

  public static AccesoViewModel_Factory create(Provider<AccederUseCase> accederUseCaseProvider) {
    return new AccesoViewModel_Factory(accederUseCaseProvider);
  }

  public static AccesoViewModel newInstance(AccederUseCase accederUseCase) {
    return new AccesoViewModel(accederUseCase);
  }
}
