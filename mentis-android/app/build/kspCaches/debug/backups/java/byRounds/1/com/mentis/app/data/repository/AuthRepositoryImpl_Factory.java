package com.mentis.app.data.repository;

import com.mentis.app.data.local.datastore.TokenManager;
import com.mentis.app.data.remote.api.MentisApi;
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
public final class AuthRepositoryImpl_Factory implements Factory<AuthRepositoryImpl> {
  private final Provider<MentisApi> apiProvider;

  private final Provider<TokenManager> tokenManagerProvider;

  public AuthRepositoryImpl_Factory(Provider<MentisApi> apiProvider,
      Provider<TokenManager> tokenManagerProvider) {
    this.apiProvider = apiProvider;
    this.tokenManagerProvider = tokenManagerProvider;
  }

  @Override
  public AuthRepositoryImpl get() {
    return newInstance(apiProvider.get(), tokenManagerProvider.get());
  }

  public static AuthRepositoryImpl_Factory create(Provider<MentisApi> apiProvider,
      Provider<TokenManager> tokenManagerProvider) {
    return new AuthRepositoryImpl_Factory(apiProvider, tokenManagerProvider);
  }

  public static AuthRepositoryImpl newInstance(MentisApi api, TokenManager tokenManager) {
    return new AuthRepositoryImpl(api, tokenManager);
  }
}
