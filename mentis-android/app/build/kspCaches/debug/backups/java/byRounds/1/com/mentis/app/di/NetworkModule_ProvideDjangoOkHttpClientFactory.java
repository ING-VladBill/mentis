package com.mentis.app.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("javax.inject.Named")
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
public final class NetworkModule_ProvideDjangoOkHttpClientFactory implements Factory<OkHttpClient> {
  private final Provider<HttpLoggingInterceptor> loggingInterceptorProvider;

  public NetworkModule_ProvideDjangoOkHttpClientFactory(
      Provider<HttpLoggingInterceptor> loggingInterceptorProvider) {
    this.loggingInterceptorProvider = loggingInterceptorProvider;
  }

  @Override
  public OkHttpClient get() {
    return provideDjangoOkHttpClient(loggingInterceptorProvider.get());
  }

  public static NetworkModule_ProvideDjangoOkHttpClientFactory create(
      Provider<HttpLoggingInterceptor> loggingInterceptorProvider) {
    return new NetworkModule_ProvideDjangoOkHttpClientFactory(loggingInterceptorProvider);
  }

  public static OkHttpClient provideDjangoOkHttpClient(HttpLoggingInterceptor loggingInterceptor) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideDjangoOkHttpClient(loggingInterceptor));
  }
}
