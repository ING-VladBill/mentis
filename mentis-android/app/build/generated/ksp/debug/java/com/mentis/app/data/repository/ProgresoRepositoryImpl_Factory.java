package com.mentis.app.data.repository;

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
public final class ProgresoRepositoryImpl_Factory implements Factory<ProgresoRepositoryImpl> {
  private final Provider<MentisApi> apiProvider;

  public ProgresoRepositoryImpl_Factory(Provider<MentisApi> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public ProgresoRepositoryImpl get() {
    return newInstance(apiProvider.get());
  }

  public static ProgresoRepositoryImpl_Factory create(Provider<MentisApi> apiProvider) {
    return new ProgresoRepositoryImpl_Factory(apiProvider);
  }

  public static ProgresoRepositoryImpl newInstance(MentisApi api) {
    return new ProgresoRepositoryImpl(api);
  }
}
