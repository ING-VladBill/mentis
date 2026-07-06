package com.mentis.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mentis.app.data.local.entity.PreguntaEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PreguntaDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertarTodas(preguntas: List<PreguntaEntity>)

    @Query("SELECT * FROM preguntas_examen WHERE examenId = :examenId ORDER BY orden ASC")
    fun observarPreguntas(examenId: Int): Flow<List<PreguntaEntity>>

    @Query("SELECT * FROM preguntas_examen WHERE examenId = :examenId ORDER BY orden ASC")
    suspend fun obtenerPreguntas(examenId: Int): List<PreguntaEntity>

    @Query(
        "UPDATE preguntas_examen SET respuestaCandidato = :respuesta, respondida = 1, " +
                "sincronizada = :sincronizada WHERE id = :preguntaId"
    )
    suspend fun guardarRespuestaLocal(preguntaId: Int, respuesta: String, sincronizada: Boolean)

    @Query("SELECT * FROM preguntas_examen WHERE examenId = :examenId AND sincronizada = 0")
    suspend fun obtenerPendientesSincronizar(examenId: Int): List<PreguntaEntity>

    @Query("DELETE FROM preguntas_examen WHERE examenId = :examenId")
    suspend fun limpiarExamen(examenId: Int)
}