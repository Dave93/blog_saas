import Elysia from "elysia";
import { usersController } from "./modules/users/controller";
import { permissionsController } from "./modules/permissions/controller";
import { rolesController } from "./modules/roles/controller";
import { rolesPermissionsController } from "./modules/roles_permissions/controller";
import { settingsController } from "./modules/settings/controller";
import { usersPermissionsController } from "./modules/users_permissions/controller";
import { usersRolesController } from "./modules/users_roles/controller";
import { blogController } from "./modules/blog/controller";

export const apiController = new Elysia({
  name: "@api",
  prefix: "/api",
})
  .use(usersController)
  .use(permissionsController)
  .use(rolesController)
  .use(rolesPermissionsController)
  .use(settingsController)
  .use(usersPermissionsController)
  .use(usersRolesController)
  .use(blogController);
