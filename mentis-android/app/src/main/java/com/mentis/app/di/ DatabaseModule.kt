package com.mentis.app.di

import android.content.Context
import androidx.room.Room
import com.mentis.app.data.local.MentisDatabase
import com.mentis.app.data.local.dao.PreguntaDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideMentisDatabase(@ApplicationContext context: Context): MentisDatabase =
        Room.databaseBuilder(
            context,
            MentisDatabase::class.java,
            "mentis_database"
        ).build()

    @Provides
    @Singleton
    fun providePreguntaDao(database: MentisDatabase): PreguntaDao =
        database.preguntaDao()
}