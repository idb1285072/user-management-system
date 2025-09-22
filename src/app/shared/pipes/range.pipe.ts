import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'range',
  pure: true,
})
export class RangePipe implements PipeTransform {
  transform(value: number) {
    return Array.from({ length: value }, (_, i) => i + 1);
  }
}
