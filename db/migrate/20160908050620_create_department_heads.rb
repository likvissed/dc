class CreateDepartmentHeads < ActiveRecord::Migration
  def change
    create_table :department_heads do |t|
      t.integer :tn
      t.integer :dept, index: true
      t.string  :info, index: true
      t.timestamps null: false
    end
  end
end
