// Genera el SQL para crear (o resetear la clave de) un usuario.
//
// Uso:
//   node scripts/crear-usuario.mjs <username> <password> "<Nombre Completo>" <rol>
//
// <rol> es uno de: admin | secretario | funcionario
//
// Ejemplo (usuario administrador):
//   node scripts/crear-usuario.mjs admin "MiClaveSegura123" "Administrador" admin
//
// Ejemplo (funcionario):
//   node scripts/crear-usuario.mjs jorge.perez "Clave123" "Jorge Pérez" funcionario
//
// El script solo IMPRIME el INSERT en pantalla. Cópialo y pégalo en el
// editor SQL de Supabase para ejecutarlo (no toca la base de datos directamente).

import bcrypt from "bcryptjs";

const [, , username, password, fullName, role] = process.argv;

if (!username || !password || !fullName || !role) {
  console.error(
    'Uso: node scripts/crear-usuario.mjs <username> <password> "<Nombre Completo>" <admin|secretario|funcionario>'
  );
  process.exit(1);
}

if (!["admin", "secretario", "funcionario"].includes(role)) {
  console.error("El rol debe ser: admin, secretario o funcionario");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log("\n-- Copia y ejecuta este SQL en Supabase:\n");
console.log(
  `insert into public.app_users (username, password_hash, full_name, role, is_active)\n` +
    `values ('${username}', '${hash}', '${fullName.replace(/'/g, "''")}', '${role}', true)\n` +
    `on conflict (username) do update set\n` +
    `  password_hash = excluded.password_hash,\n` +
    `  full_name = excluded.full_name,\n` +
    `  role = excluded.role,\n` +
    `  is_active = true;\n`
);
