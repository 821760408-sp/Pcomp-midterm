function Vals() {
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.prev_x = 0;
  this.prev_y = 0;
  this.prev_z = 0;
  this.min_x = 1023;
  this.max_x = 0;
  this.min_y = 1023;
  this.max_y = 0;
  this.min_z = 1023;
  this.max_z = 0;

  this.updateMinMax = function() {
    if (this.x < this.min_x) this.min_x = this.x;
    if (this.y < this.min_y) this.min_y = this.y;
    if (this.z < this.min_z) this.min_z = this.z;
    if (this.x > this.max_x) this.max_x = this.x;
    if (this.y > this.max_y) this.max_y = this.y;
    if (this.z > this.max_z) this.max_z = this.z;
  }
}