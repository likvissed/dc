class CreateSystemRequirements < ActiveRecord::Migration[5.0]
  def change
    create_table :system_requirements do |t|
      t.string :name_os
      t.integer :kernel_count
      t.float :frequency
      t.float :memory
      t.float :disk_space
    end
  end
end
