package com.mentis.app.di;

import com.mentis.app.data.remote.api.MentisApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import retrofit2.Retrofit;

@ScopeMetadata("javax.inject.Singleton")
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
public final class NetworkModule_ProvideMentisApiFactory implements Factory<MentisApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideMentisApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public MentisApi get() {
    return provideMentisApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvideMentisApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideMentisApiFactory(retrofitProvider);
  }

  public static MentisApi provideMentisApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideMentisApi(retrofit));
  }
}
