package com.mentis.app.di;

import android.content.Context;
import com.mentis.app.data.local.MentisDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
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
public final class DatabaseModule_ProvideMentisDatabaseFactory implements Factory<MentisDatabase> {
  private final Provider<Context> contextProvider;

  public DatabaseModule_ProvideMentisDatabaseFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public MentisDatabase get() {
    return provideMentisDatabase(contextProvider.get());
  }

  public static DatabaseModule_ProvideMentisDatabaseFactory create(
      Provider<Context> contextProvider) {
    return new DatabaseModule_ProvideMentisDatabaseFactory(contextProvider);
  }

  public static MentisDatabase provideMentisDatabase(Context context) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideMentisDatabase(context));
  }
}
