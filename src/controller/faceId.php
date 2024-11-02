<?php
$servername = "localhost";
$username = "root"; // padrão do Laragon
$password = ""; // padrão do Laragon
$dbname = "usuario"; // nome do seu banco de dados

// Criar conexão
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Exemplo de dados da face que você pode ter recebido
$faceData = json_encode($_POST['face_data']); // Supondo que você está recebendo os dados via POST
$userId = $_POST['user_id']; // ID do usuário, se aplicável

// Inserir dados na tabela
$sql = "INSERT INTO faces (user_id, face_data) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $userId, $faceData);

if ($stmt->execute()) {
    echo "Novo registro criado com sucesso";
} else {
    echo "Erro: " . $sql . "<br>" . $conn->error;
}

$stmt->close();
$conn->close();
?>
