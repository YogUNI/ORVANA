import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../utils/api-response';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response already follows the { data, meta } structure
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          !Array.isArray(response)
        ) {
          return response;
        }

        return {
          data: response ?? null,
        };
      }),
    );
  }
}
