package com.mentis.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.mentis.app.data.local.dao.PreguntaDao
import com.mentis.app.data.local.entity.PreguntaEntity

@Database(
    entities = [PreguntaEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class MentisDatabase : RoomDatabase() {
    abstract fun preguntaDao(): PreguntaDao
}