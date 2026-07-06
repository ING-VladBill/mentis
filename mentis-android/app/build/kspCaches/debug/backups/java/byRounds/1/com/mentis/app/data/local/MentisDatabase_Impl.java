package com.mentis.app.data.local;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.mentis.app.data.local.dao.PreguntaDao;
import com.mentis.app.data.local.dao.PreguntaDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class MentisDatabase_Impl extends MentisDatabase {
  private volatile PreguntaDao _preguntaDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `preguntas_examen` (`id` INTEGER NOT NULL, `examenId` INTEGER NOT NULL, `orden` INTEGER NOT NULL, `tipo` TEXT NOT NULL, `categoria` TEXT NOT NULL, `enunciado` TEXT NOT NULL, `opciones` TEXT NOT NULL, `puntos` INTEGER NOT NULL, `respuestaCandidato` TEXT, `respondida` INTEGER NOT NULL, `sincronizada` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '84767b28d1786a326bbba85637459315')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `preguntas_examen`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsPreguntasExamen = new HashMap<String, TableInfo.Column>(11);
        _columnsPreguntasExamen.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("examenId", new TableInfo.Column("examenId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("orden", new TableInfo.Column("orden", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("tipo", new TableInfo.Column("tipo", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("categoria", new TableInfo.Column("categoria", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("enunciado", new TableInfo.Column("enunciado", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("opciones", new TableInfo.Column("opciones", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("puntos", new TableInfo.Column("puntos", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("respuestaCandidato", new TableInfo.Column("respuestaCandidato", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("respondida", new TableInfo.Column("respondida", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPreguntasExamen.put("sincronizada", new TableInfo.Column("sincronizada", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPreguntasExamen = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPreguntasExamen = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPreguntasExamen = new TableInfo("preguntas_examen", _columnsPreguntasExamen, _foreignKeysPreguntasExamen, _indicesPreguntasExamen);
        final TableInfo _existingPreguntasExamen = TableInfo.read(db, "preguntas_examen");
        if (!_infoPreguntasExamen.equals(_existingPreguntasExamen)) {
          return new RoomOpenHelper.ValidationResult(false, "preguntas_examen(com.mentis.app.data.local.entity.PreguntaEntity).\n"
                  + " Expected:\n" + _infoPreguntasExamen + "\n"
                  + " Found:\n" + _existingPreguntasExamen);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "84767b28d1786a326bbba85637459315", "0033fc65db5bbb729774d3da9e887a9f");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "preguntas_examen");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `preguntas_examen`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(PreguntaDao.class, PreguntaDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public PreguntaDao preguntaDao() {
    if (_preguntaDao != null) {
      return _preguntaDao;
    } else {
      synchronized(this) {
        if(_preguntaDao == null) {
          _preguntaDao = new PreguntaDao_Impl(this);
        }
        return _preguntaDao;
      }
    }
  }
}
