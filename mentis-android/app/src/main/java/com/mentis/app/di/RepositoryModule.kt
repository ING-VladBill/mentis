package com.mentis.app.di

import com.mentis.app.data.repository.AuthRepositoryImpl
import com.mentis.app.data.repository.ExamenRepositoryImpl
import com.mentis.app.data.repository.ProgresoRepositoryImpl
import com.mentis.app.data.repository.VacantesRepositoryImpl
import com.mentis.app.domain.repository.AuthRepository
import com.mentis.app.domain.repository.ExamenRepository
import com.mentis.app.domain.repository.ProgresoRepository
import com.mentis.app.domain.repository.VacantesRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindProgresoRepository(impl: ProgresoRepositoryImpl): ProgresoRepository

    @Binds
    @Singleton
    abstract fun bindExamenRepository(impl: ExamenRepositoryImpl): ExamenRepository

    @Binds
    @Singleton
    abstract fun bindVacantesRepository(impl: VacantesRepositoryImpl): VacantesRepository
}