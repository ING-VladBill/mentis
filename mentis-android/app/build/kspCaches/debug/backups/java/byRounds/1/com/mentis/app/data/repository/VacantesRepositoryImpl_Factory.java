package com.mentis.app.data.repository;

import android.content.Context;
import com.mentis.app.data.remote.api.VacantesApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class VacantesRepositoryImpl_Factory implements Factory<VacantesRepositoryImpl> {
  private final Provider<VacantesApi> apiProvider;

  private final Provider<Context> contextProvider;

  public VacantesRepositoryImpl_Factory(Provider<VacantesApi> apiProvider,
      Provider<Context> contextProvider) {
    this.apiProvider = apiProvider;
    this.contextProvider = contextProvider;
  }

  @Override
  public VacantesRepositoryImpl get() {
    return newInstance(apiProvider.get(), contextProvider.get());
  }

  public static VacantesRepositoryImpl_Factory create(Provider<VacantesApi> apiProvider,
      Provider<Context> contextProvider) {
    return new VacantesRepositoryImpl_Factory(apiProvider, contextProvider);
  }

  public static VacantesRepositoryImpl newInstance(VacantesApi api, Context context) {
    return new VacantesRepositoryImpl(api, context);
  }
}
