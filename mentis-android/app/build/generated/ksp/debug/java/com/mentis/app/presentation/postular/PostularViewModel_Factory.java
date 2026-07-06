package com.mentis.app.presentation.postular;

import com.mentis.app.domain.usecase.PostularUseCase;
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
public final class PostularViewModel_Factory implements Factory<PostularViewModel> {
  private final Provider<PostularUseCase> postularUseCaseProvider;

  public PostularViewModel_Factory(Provider<PostularUseCase> postularUseCaseProvider) {
    this.postularUseCaseProvider = postularUseCaseProvider;
  }

  @Override
  public PostularViewModel get() {
    return newInstance(postularUseCaseProvider.get());
  }

  public static PostularViewModel_Factory create(
      Provider<PostularUseCase> postularUseCaseProvider) {
    return new PostularViewModel_Factory(postularUseCaseProvider);
  }

  public static PostularViewModel newInstance(PostularUseCase postularUseCase) {
    return new PostularViewModel(postularUseCase);
  }
}
