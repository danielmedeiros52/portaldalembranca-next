import express, { json, Request, Response } from 'express';
import http from 'http';

type HttpMethod = 'get' | 'post';

type RouteDefinition = {
  method: HttpMethod;
  path: string;
  handlerName: string;
};

type ModuleMetadata = {
  controllers?: Array<new (...args: any[]) => any>;
  providers?: Array<new (...args: any[]) => any>;
  imports?: Array<new (...args: any[]) => any>;
};

const controllerMetadata = new WeakMap<object, { prefix: string }>();
const moduleMetadata = new WeakMap<object, ModuleMetadata>();
const routeMetadata = new WeakMap<object, RouteDefinition[]>();
const parameterMetadata = new WeakMap<object, Map<string | symbol, Array<{ index: number; type: 'body' | 'param'; paramName?: string }>>>();

export class Logger {
  constructor(private readonly context: string) {}

  log(message: string) {
    console.log(`[${this.context}] ${message}`);
  }

  warn(message: string) {
    console.warn(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}

export class BadRequestException extends Error {
  public readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
  }
}

export function Controller(prefix = '') {
  return (target: object) => {
    controllerMetadata.set(target, { prefix });
  };
}

export function Module(metadata: ModuleMetadata) {
  return (target: object) => {
    moduleMetadata.set(target, metadata);
  };
}

function addRoute(target: object, definition: RouteDefinition) {
  const routes = routeMetadata.get(target) ?? [];
  routes.push(definition);
  routeMetadata.set(target, routes);
}

export function Get(path = '') {
  return (target: object, propertyKey: string | symbol) =>
    addRoute(target.constructor, { method: 'get', path, handlerName: String(propertyKey) });
}

export function Post(path = '') {
  return (target: object, propertyKey: string | symbol) =>
    addRoute(target.constructor, { method: 'post', path, handlerName: String(propertyKey) });
}

export function Body() {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const params = parameterMetadata.get(target.constructor) ?? new Map();
    const descriptors = params.get(propertyKey) ?? [];
    descriptors.push({ index: parameterIndex, type: 'body' });
    params.set(propertyKey, descriptors);
    parameterMetadata.set(target.constructor, params);
  };
}

export function Param(paramName: string) {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    const params = parameterMetadata.get(target.constructor) ?? new Map();
    const descriptors = params.get(propertyKey) ?? [];
    descriptors.push({ index: parameterIndex, type: 'param', paramName });
    params.set(propertyKey, descriptors);
    parameterMetadata.set(target.constructor, params);
  };
}

export function Injectable() {
  return (_target: object) => undefined;
}

function getModule(target: object) {
  return moduleMetadata.get(target) ?? { controllers: [], providers: [] };
}

function getController(target: object) {
  return controllerMetadata.get(target) ?? { prefix: '' };
}

function getRoutes(target: object) {
  return routeMetadata.get(target) ?? [];
}

function getParams(target: object, propertyKey: string) {
  const params = parameterMetadata.get(target) ?? new Map();
  return params.get(propertyKey) ?? [];
}

class MiniNestApplication {
  private readonly app = express();
  private readonly server = http.createServer(this.app);
  private globalPrefix = '';
  private readonly corsHeaders: Record<string, string> = {};
  private readonly logger = new Logger('MiniNest');

  constructor(private readonly rootModule: new () => unknown) {
    this.app.use(json({ limit: '1mb' }));
  }

  enableCors() {
    this.corsHeaders['Access-Control-Allow-Origin'] = '*';
    this.corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    this.corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    this.app.use((_req, res, next) => {
      Object.entries(this.corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      if (_req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      next();
    });
  }

  setGlobalPrefix(prefix: string) {
    this.globalPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
  }

  /**
   * Recursively collect all controllers from a module and its imports
   */
  private collectControllersFromModule(moduleClass: new () => unknown): Array<new (...args: any[]) => any> {
    const moduleMeta = getModule(moduleClass);
    const controllers: Array<new (...args: any[]) => any> = [];

    // Add controllers from this module
    if (moduleMeta.controllers) {
      controllers.push(...moduleMeta.controllers);
    }

    // Recursively add controllers from imported modules
    if (moduleMeta.imports) {
      for (const importedModule of moduleMeta.imports) {
        const importedControllers = this.collectControllersFromModule(importedModule);
        controllers.push(...importedControllers);
      }
    }

    return controllers;
  }

  private registerController(controller: new (...args: any[]) => any) {
    const instance = new controller() as Record<string, unknown>;
    const { prefix } = getController(controller);
    const routes = getRoutes(controller);

    routes.forEach(route => {
      const handler = instance[route.handlerName] as unknown;
      if (typeof handler !== 'function') {
        return;
      }

      // Handle route parameters like :id
      let routePath = route.path;
      if (routePath.includes(':')) {
        // Express already handles :param syntax
      }

      const fullPath = `${this.globalPrefix}${prefix ? `/${prefix}` : ''}${routePath ? `/${routePath}` : ''}`
        .replace(/\/+/g, '/')
        .replace(/\/+$/, '') || '/';

      const paramMeta = getParams(controller, route.handlerName);

      const routerMethod = (this.app as unknown as Record<string, unknown>)[route.method] as
        | ((path: string, handler: (req: Request, res: Response) => void) => void)
        | undefined;

      this.logger.log(`Registering route: ${route.method.toUpperCase()} ${fullPath}`);

      routerMethod?.call(
        this.app,
        fullPath,
        async (req: Request, res: Response) => {
          try {
            const args: unknown[] = [];
            paramMeta.forEach((param: { index: number; type: 'body' | 'param'; paramName?: string }) => {
              if (param.type === 'body') {
                args[param.index] = req.body;
              } else if (param.type === 'param' && param.paramName) {
                args[param.index] = req.params[param.paramName];
              }
            });

            const result = await (handler as (...args: unknown[]) => unknown).apply(instance, args);
            res.json(result);
          } catch (error) {
            this.logger.error(`Error in ${route.method.toUpperCase()} ${fullPath}: ${(error as Error).message}`);
            const status = (error as { status?: number }).status ?? 500;
            res.status(status).json({ message: (error as Error).message });
          }
        },
      );
    });
  }

  private registerControllers() {
    // Collect all controllers from root module and imported modules
    const allControllers = this.collectControllersFromModule(this.rootModule);
    
    this.logger.log(`Found ${allControllers.length} controllers to register`);
    
    // Register each controller
    allControllers.forEach(controller => {
      this.registerController(controller);
    });
  }

  async listen(port: number | string) {
    this.registerControllers();
    return new Promise<void>(resolve => {
      this.server.listen(port, () => resolve());
    });
  }
}

export const NestFactory = {
  async create(module: new () => unknown, _options?: { bufferLogs?: boolean }) {
    return new MiniNestApplication(module);
  },
};

export const TestingFactory = {
  createTestingModule({ controllers = [], providers = [] }: ModuleMetadata) {
    return {
      compile: async () => {
        const providerInstances = new Map<unknown, unknown>();
        providers.forEach(provider => providerInstances.set(provider, new provider()));

        const controllerInstances = controllers.map(ControllerType => new ControllerType());
        return {
          get: <T>(type: new () => T): T => {
            const providerInstance = providerInstances.get(type);
            if (providerInstance) return providerInstance as T;

            const controllerInstance = controllerInstances.find(instance => instance instanceof type);
            if (!controllerInstance) {
              throw new Error(`Provider ${type.name} not found`);
            }
            return controllerInstance as T;
          },
        };
      },
    };
  },
};
