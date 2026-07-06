package com.mentis.app.data.local.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.mentis.app.data.local.Converters;
import com.mentis.app.data.local.entity.PreguntaEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class PreguntaDao_Impl implements PreguntaDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PreguntaEntity> __insertionAdapterOfPreguntaEntity;

  private final Converters __converters = new Converters();

  private final SharedSQLiteStatement __preparedStmtOfGuardarRespuestaLocal;

  private final SharedSQLiteStatement __preparedStmtOfLimpiarExamen;

  public PreguntaDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPreguntaEntity = new EntityInsertionAdapter<PreguntaEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `preguntas_examen` (`id`,`examenId`,`orden`,`tipo`,`categoria`,`enunciado`,`opciones`,`puntos`,`respuestaCandidato`,`respondida`,`sincronizada`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PreguntaEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getExamenId());
        statement.bindLong(3, entity.getOrden());
        statement.bindString(4, entity.getTipo());
        statement.bindString(5, entity.getCategoria());
        statement.bindString(6, entity.getEnunciado());
        final String _tmp = __converters.fromStringList(entity.getOpciones());
        statement.bindString(7, _tmp);
        statement.bindLong(8, entity.getPuntos());
        if (entity.getRespuestaCandidato() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getRespuestaCandidato());
        }
        final int _tmp_1 = entity.getRespondida() ? 1 : 0;
        statement.bindLong(10, _tmp_1);
        final int _tmp_2 = entity.getSincronizada() ? 1 : 0;
        statement.bindLong(11, _tmp_2);
      }
    };
    this.__preparedStmtOfGuardarRespuestaLocal = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE preguntas_examen SET respuestaCandidato = ?, respondida = 1, sincronizada = ? WHERE id = ?";
        return _query;
      }
    };
    this.__preparedStmtOfLimpiarExamen = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM preguntas_examen WHERE examenId = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertarTodas(final List<PreguntaEntity> preguntas,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPreguntaEntity.insert(preguntas);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object guardarRespuestaLocal(final int preguntaId, final String respuesta,
      final boolean sincronizada, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfGuardarRespuestaLocal.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, respuesta);
        _argIndex = 2;
        final int _tmp = sincronizada ? 1 : 0;
        _stmt.bindLong(_argIndex, _tmp);
        _argIndex = 3;
        _stmt.bindLong(_argIndex, preguntaId);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfGuardarRespuestaLocal.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object limpiarExamen(final int examenId, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfLimpiarExamen.acquire();
        int _argIndex = 1;
        _stmt.bindLong(_argIndex, examenId);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfLimpiarExamen.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<PreguntaEntity>> observarPreguntas(final int examenId) {
    final String _sql = "SELECT * FROM preguntas_examen WHERE examenId = ? ORDER BY orden ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, examenId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"preguntas_examen"}, new Callable<List<PreguntaEntity>>() {
      @Override
      @NonNull
      public List<PreguntaEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfExamenId = CursorUtil.getColumnIndexOrThrow(_cursor, "examenId");
          final int _cursorIndexOfOrden = CursorUtil.getColumnIndexOrThrow(_cursor, "orden");
          final int _cursorIndexOfTipo = CursorUtil.getColumnIndexOrThrow(_cursor, "tipo");
          final int _cursorIndexOfCategoria = CursorUtil.getColumnIndexOrThrow(_cursor, "categoria");
          final int _cursorIndexOfEnunciado = CursorUtil.getColumnIndexOrThrow(_cursor, "enunciado");
          final int _cursorIndexOfOpciones = CursorUtil.getColumnIndexOrThrow(_cursor, "opciones");
          final int _cursorIndexOfPuntos = CursorUtil.getColumnIndexOrThrow(_cursor, "puntos");
          final int _cursorIndexOfRespuestaCandidato = CursorUtil.getColumnIndexOrThrow(_cursor, "respuestaCandidato");
          final int _cursorIndexOfRespondida = CursorUtil.getColumnIndexOrThrow(_cursor, "respondida");
          final int _cursorIndexOfSincronizada = CursorUtil.getColumnIndexOrThrow(_cursor, "sincronizada");
          final List<PreguntaEntity> _result = new ArrayList<PreguntaEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PreguntaEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final int _tmpExamenId;
            _tmpExamenId = _cursor.getInt(_cursorIndexOfExamenId);
            final int _tmpOrden;
            _tmpOrden = _cursor.getInt(_cursorIndexOfOrden);
            final String _tmpTipo;
            _tmpTipo = _cursor.getString(_cursorIndexOfTipo);
            final String _tmpCategoria;
            _tmpCategoria = _cursor.getString(_cursorIndexOfCategoria);
            final String _tmpEnunciado;
            _tmpEnunciado = _cursor.getString(_cursorIndexOfEnunciado);
            final List<String> _tmpOpciones;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfOpciones);
            _tmpOpciones = __converters.toStringList(_tmp);
            final int _tmpPuntos;
            _tmpPuntos = _cursor.getInt(_cursorIndexOfPuntos);
            final String _tmpRespuestaCandidato;
            if (_cursor.isNull(_cursorIndexOfRespuestaCandidato)) {
              _tmpRespuestaCandidato = null;
            } else {
              _tmpRespuestaCandidato = _cursor.getString(_cursorIndexOfRespuestaCandidato);
            }
            final boolean _tmpRespondida;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfRespondida);
            _tmpRespondida = _tmp_1 != 0;
            final boolean _tmpSincronizada;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfSincronizada);
            _tmpSincronizada = _tmp_2 != 0;
            _item = new PreguntaEntity(_tmpId,_tmpExamenId,_tmpOrden,_tmpTipo,_tmpCategoria,_tmpEnunciado,_tmpOpciones,_tmpPuntos,_tmpRespuestaCandidato,_tmpRespondida,_tmpSincronizada);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object obtenerPreguntas(final int examenId,
      final Continuation<? super List<PreguntaEntity>> $completion) {
    final String _sql = "SELECT * FROM preguntas_examen WHERE examenId = ? ORDER BY orden ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, examenId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PreguntaEntity>>() {
      @Override
      @NonNull
      public List<PreguntaEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfExamenId = CursorUtil.getColumnIndexOrThrow(_cursor, "examenId");
          final int _cursorIndexOfOrden = CursorUtil.getColumnIndexOrThrow(_cursor, "orden");
          final int _cursorIndexOfTipo = CursorUtil.getColumnIndexOrThrow(_cursor, "tipo");
          final int _cursorIndexOfCategoria = CursorUtil.getColumnIndexOrThrow(_cursor, "categoria");
          final int _cursorIndexOfEnunciado = CursorUtil.getColumnIndexOrThrow(_cursor, "enunciado");
          final int _cursorIndexOfOpciones = CursorUtil.getColumnIndexOrThrow(_cursor, "opciones");
          final int _cursorIndexOfPuntos = CursorUtil.getColumnIndexOrThrow(_cursor, "puntos");
          final int _cursorIndexOfRespuestaCandidato = CursorUtil.getColumnIndexOrThrow(_cursor, "respuestaCandidato");
          final int _cursorIndexOfRespondida = CursorUtil.getColumnIndexOrThrow(_cursor, "respondida");
          final int _cursorIndexOfSincronizada = CursorUtil.getColumnIndexOrThrow(_cursor, "sincronizada");
          final List<PreguntaEntity> _result = new ArrayList<PreguntaEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PreguntaEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final int _tmpExamenId;
            _tmpExamenId = _cursor.getInt(_cursorIndexOfExamenId);
            final int _tmpOrden;
            _tmpOrden = _cursor.getInt(_cursorIndexOfOrden);
            final String _tmpTipo;
            _tmpTipo = _cursor.getString(_cursorIndexOfTipo);
            final String _tmpCategoria;
            _tmpCategoria = _cursor.getString(_cursorIndexOfCategoria);
            final String _tmpEnunciado;
            _tmpEnunciado = _cursor.getString(_cursorIndexOfEnunciado);
            final List<String> _tmpOpciones;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfOpciones);
            _tmpOpciones = __converters.toStringList(_tmp);
            final int _tmpPuntos;
            _tmpPuntos = _cursor.getInt(_cursorIndexOfPuntos);
            final String _tmpRespuestaCandidato;
            if (_cursor.isNull(_cursorIndexOfRespuestaCandidato)) {
              _tmpRespuestaCandidato = null;
            } else {
              _tmpRespuestaCandidato = _cursor.getString(_cursorIndexOfRespuestaCandidato);
            }
            final boolean _tmpRespondida;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfRespondida);
            _tmpRespondida = _tmp_1 != 0;
            final boolean _tmpSincronizada;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfSincronizada);
            _tmpSincronizada = _tmp_2 != 0;
            _item = new PreguntaEntity(_tmpId,_tmpExamenId,_tmpOrden,_tmpTipo,_tmpCategoria,_tmpEnunciado,_tmpOpciones,_tmpPuntos,_tmpRespuestaCandidato,_tmpRespondida,_tmpSincronizada);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object obtenerPendientesSincronizar(final int examenId,
      final Continuation<? super List<PreguntaEntity>> $completion) {
    final String _sql = "SELECT * FROM preguntas_examen WHERE examenId = ? AND sincronizada = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, examenId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PreguntaEntity>>() {
      @Override
      @NonNull
      public List<PreguntaEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfExamenId = CursorUtil.getColumnIndexOrThrow(_cursor, "examenId");
          final int _cursorIndexOfOrden = CursorUtil.getColumnIndexOrThrow(_cursor, "orden");
          final int _cursorIndexOfTipo = CursorUtil.getColumnIndexOrThrow(_cursor, "tipo");
          final int _cursorIndexOfCategoria = CursorUtil.getColumnIndexOrThrow(_cursor, "categoria");
          final int _cursorIndexOfEnunciado = CursorUtil.getColumnIndexOrThrow(_cursor, "enunciado");
          final int _cursorIndexOfOpciones = CursorUtil.getColumnIndexOrThrow(_cursor, "opciones");
          final int _cursorIndexOfPuntos = CursorUtil.getColumnIndexOrThrow(_cursor, "puntos");
          final int _cursorIndexOfRespuestaCandidato = CursorUtil.getColumnIndexOrThrow(_cursor, "respuestaCandidato");
          final int _cursorIndexOfRespondida = CursorUtil.getColumnIndexOrThrow(_cursor, "respondida");
          final int _cursorIndexOfSincronizada = CursorUtil.getColumnIndexOrThrow(_cursor, "sincronizada");
          final List<PreguntaEntity> _result = new ArrayList<PreguntaEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PreguntaEntity _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final int _tmpExamenId;
            _tmpExamenId = _cursor.getInt(_cursorIndexOfExamenId);
            final int _tmpOrden;
            _tmpOrden = _cursor.getInt(_cursorIndexOfOrden);
            final String _tmpTipo;
            _tmpTipo = _cursor.getString(_cursorIndexOfTipo);
            final String _tmpCategoria;
            _tmpCategoria = _cursor.getString(_cursorIndexOfCategoria);
            final String _tmpEnunciado;
            _tmpEnunciado = _cursor.getString(_cursorIndexOfEnunciado);
            final List<String> _tmpOpciones;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfOpciones);
            _tmpOpciones = __converters.toStringList(_tmp);
            final int _tmpPuntos;
            _tmpPuntos = _cursor.getInt(_cursorIndexOfPuntos);
            final String _tmpRespuestaCandidato;
            if (_cursor.isNull(_cursorIndexOfRespuestaCandidato)) {
              _tmpRespuestaCandidato = null;
            } else {
              _tmpRespuestaCandidato = _cursor.getString(_cursorIndexOfRespuestaCandidato);
            }
            final boolean _tmpRespondida;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfRespondida);
            _tmpRespondida = _tmp_1 != 0;
            final boolean _tmpSincronizada;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfSincronizada);
            _tmpSincronizada = _tmp_2 != 0;
            _item = new PreguntaEntity(_tmpId,_tmpExamenId,_tmpOrden,_tmpTipo,_tmpCategoria,_tmpEnunciado,_tmpOpciones,_tmpPuntos,_tmpRespuestaCandidato,_tmpRespondida,_tmpSincronizada);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
