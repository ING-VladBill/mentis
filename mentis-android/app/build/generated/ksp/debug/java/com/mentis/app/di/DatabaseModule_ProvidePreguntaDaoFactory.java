package com.mentis.app.di;

import com.mentis.app.data.local.MentisDatabase;
import com.mentis.app.data.local.dao.PreguntaDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

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
public final class DatabaseModule_ProvidePreguntaDaoFactory implements Factory<PreguntaDao> {
  private final Provider<MentisDatabase> databaseProvider;

  public DatabaseModule_ProvidePreguntaDaoFactory(Provider<MentisDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public PreguntaDao get() {
    return providePreguntaDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvidePreguntaDaoFactory create(
      Provider<MentisDatabase> databaseProvider) {
    return new DatabaseModule_ProvidePreguntaDaoFactory(databaseProvider);
  }

  public static PreguntaDao providePreguntaDao(MentisDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providePreguntaDao(database));
  }
}
