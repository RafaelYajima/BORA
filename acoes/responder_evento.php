<?php
session_start();
include("../config/conexao.php");

$id_evento = $_POST['id_evento'];
$status = $_POST['status'] ?? '';
$id_usuario = $_SESSION['usuario_id'];

$sql_check = "SELECT * FROM presencas 
              WHERE id_evento = $id_evento AND id_usuario = $id_usuario";

$result = mysqli_query($conexao, $sql_check);

if(mysqli_num_rows($result) > 0){

    $sql = "UPDATE presencas 
            SET status = '$status'
            WHERE id_evento = $id_evento AND id_usuario = $id_usuario";

}else{

    $sql = "INSERT INTO presencas (id_evento, id_usuario, status)
            VALUES ($id_evento, $id_usuario, '$status')";
}

mysqli_query($conexao, $sql);