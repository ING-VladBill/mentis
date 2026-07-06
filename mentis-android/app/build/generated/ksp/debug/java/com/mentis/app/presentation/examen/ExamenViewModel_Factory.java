package com.mentis.app.presentation.examen;

import com.mentis.app.domain.usecase.FinalizarExamenUseCase;
import com.mentis.app.domain.usecase.GuardarRespuestaUseCase;
import com.mentis.app.domain.usecase.IniciarExamenUseCase;
import com.mentis.app.domain.usecase.ObtenerEstadoExamenUseCase;
import com.mentis.app.domain.usecase.RegistrarEventoUseCase;
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
public final class ExamenViewModel_Factory implements Factory<ExamenViewModel> {
  private final Provider<IniciarExamenUseCase> iniciarExamenUseCaseProvider;

  private final Provider<ObtenerEstadoExamenUseCase> obtenerEstadoExamenUseCaseProvider;

  private final Provider<GuardarRespuestaUseCase> guardarRespuestaUseCaseProvider;

  private final Provider<FinalizarExamenUseCase> finalizarExamenUseCaseProvider;

  private final Provider<RegistrarEventoUseCase> registrarEventoUseCaseProvider;

  public ExamenViewModel_Factory(Provider<IniciarExamenUseCase> iniciarExamenUseCaseProvider,
      Provider<ObtenerEstadoExamenUseCase> obtenerEstadoExamenUseCaseProvider,
      Provider<GuardarRespuestaUseCase> guardarRespuestaUseCaseProvider,
      Provider<FinalizarExamenUseCase> finalizarExamenUseCaseProvider,
      Provider<RegistrarEventoUseCase> registrarEventoUseCaseProvider) {
    this.iniciarExamenUseCaseProvider = iniciarExamenUseCaseProvider;
    this.obtenerEstadoExamenUseCaseProvider = obtenerEstadoExamenUseCaseProvider;
    this.guardarRespuestaUseCaseProvider = guardarRespuestaUseCaseProvider;
    this.finalizarExamenUseCaseProvider = finalizarExamenUseCaseProvider;
    this.registrarEventoUseCaseProvider = registrarEventoUseCaseProvider;
  }

  @Override
  public ExamenViewModel get() {
    return newInstance(iniciarExamenUseCaseProvider.get(), obtenerEstadoExamenUseCaseProvider.get(), guardarRespuestaUseCaseProvider.get(), finalizarExamenUseCaseProvider.get(), registrarEventoUseCaseProvider.get());
  }

  public static ExamenViewModel_Factory create(
      Provider<IniciarExamenUseCase> iniciarExamenUseCaseProvider,
      Provider<ObtenerEstadoExamenUseCase> obtenerEstadoExamenUseCaseProvider,
      Provider<GuardarRespuestaUseCase> guardarRespuestaUseCaseProvider,
      Provider<FinalizarExamenUseCase> finalizarExamenUseCaseProvider,
      Provider<RegistrarEventoUseCase> registrarEventoUseCaseProvider) {
    return new ExamenViewModel_Factory(iniciarExamenUseCaseProvider, obtenerEstadoExamenUseCaseProvider, guardarRespuestaUseCaseProvider, finalizarExamenUseCaseProvider, registrarEventoUseCaseProvider);
  }

  public static ExamenViewModel newInstance(IniciarExamenUseCase iniciarExamenUseCase,
      ObtenerEstadoExamenUseCase obtenerEstadoExamenUseCase,
      GuardarRespuestaUseCase guardarRespuestaUseCase,
      FinalizarExamenUseCase finalizarExamenUseCase,
      RegistrarEventoUseCase registrarEventoUseCase) {
    return new ExamenViewModel(iniciarExamenUseCase, obtenerEstadoExamenUseCase, guardarRespuestaUseCase, finalizarExamenUseCase, registrarEventoUseCase);
  }
}
