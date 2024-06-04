import Elysia from "elysia";
import { usersController } from "./modules/users/controller";
import { credentialsController } from "./modules/credentials/controller";
import { permissionsController } from "./modules/permissions/controller";
import { rolesController } from "./modules/roles/controller";
import { rolesPermissionsController } from "./modules/roles_permissions/controller";
import { sessionController } from "./modules/sessions/controller";
import { settingsController } from "./modules/settings/controller";
import { usersPermissionsController } from "./modules/users_permissions/controller";
import { usersRolesController } from "./modules/users_roles/controller";

export const apiController = new Elysia({
  name: "@api",
  prefix: "/api",
})
  .use(usersController)
  .use(credentialsController)
  .use(permissionsController)
  .use(rolesController)
  .use(rolesPermissionsController)
  .use(sessionController)
  .use(settingsController)
  .use(usersPermissionsController)
  .use(usersRolesController);
