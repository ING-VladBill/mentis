package com.mentis.app.data.repository;

import com.mentis.app.data.local.dao.PreguntaDao;
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
public final class ExamenRepositoryImpl_Factory implements Factory<ExamenRepositoryImpl> {
  private final Provider<MentisApi> apiProvider;

  private final Provider<PreguntaDao> preguntaDaoProvider;

  public ExamenRepositoryImpl_Factory(Provider<MentisApi> apiProvider,
      Provider<PreguntaDao> preguntaDaoProvider) {
    this.apiProvider = apiProvider;
    this.preguntaDaoProvider = preguntaDaoProvider;
  }

  @Override
  public ExamenRepositoryImpl get() {
    return newInstance(apiProvider.get(), preguntaDaoProvider.get());
  }

  public static ExamenRepositoryImpl_Factory create(Provider<MentisApi> apiProvider,
      Provider<PreguntaDao> preguntaDaoProvider) {
    return new ExamenRepositoryImpl_Factory(apiProvider, preguntaDaoProvider);
  }

  public static ExamenRepositoryImpl newInstance(MentisApi api, PreguntaDao preguntaDao) {
    return new ExamenRepositoryImpl(api, preguntaDao);
  }
}
