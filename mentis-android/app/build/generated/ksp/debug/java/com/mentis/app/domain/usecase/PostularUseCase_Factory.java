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
public final class PostularUseCase_Factory implements Factory<PostularUseCase> {
  private final Provider<VacantesRepository> vacantesRepositoryProvider;

  public PostularUseCase_Factory(Provider<VacantesRepository> vacantesRepositoryProvider) {
    this.vacantesRepositoryProvider = vacantesRepositoryProvider;
  }

  @Override
  public PostularUseCase get() {
    return newInstance(vacantesRepositoryProvider.get());
  }

  public static PostularUseCase_Factory create(
      Provider<VacantesRepository> vacantesRepositoryProvider) {
    return new PostularUseCase_Factory(vacantesRepositoryProvider);
  }

  public static PostularUseCase newInstance(VacantesRepository vacantesRepository) {
    return new PostularUseCase(vacantesRepository);
  }
}
