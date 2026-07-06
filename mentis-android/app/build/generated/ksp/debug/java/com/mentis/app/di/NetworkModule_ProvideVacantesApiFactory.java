package com.mentis.app.di;

import com.mentis.app.data.remote.api.VacantesApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvideVacantesApiFactory implements Factory<VacantesApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideVacantesApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public VacantesApi get() {
    return provideVacantesApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvideVacantesApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideVacantesApiFactory(retrofitProvider);
  }

  public static VacantesApi provideVacantesApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideVacantesApi(retrofit));
  }
}
