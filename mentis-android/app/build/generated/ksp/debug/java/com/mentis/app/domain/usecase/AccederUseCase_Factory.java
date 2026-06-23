package com.mentis.app.domain.usecase;

import com.mentis.app.domain.repository.AuthRepository;
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
public final class AccederUseCase_Factory implements Factory<AccederUseCase> {
  private final Provider<AuthRepository> authRepositoryProvider;

  public AccederUseCase_Factory(Provider<AuthRepository> authRepositoryProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
  }

  @Override
  public AccederUseCase get() {
    return newInstance(authRepositoryProvider.get());
  }

  public static AccederUseCase_Factory create(Provider<AuthRepository> authRepositoryProvider) {
    return new AccederUseCase_Factory(authRepositoryProvider);
  }

  public static AccederUseCase newInstance(AuthRepository authRepository) {
    return new AccederUseCase(authRepository);
  }
}
