class CreateNodeRoles < ActiveRecord::Migration
  def change
    create_table :node_roles do |t|
      t.string :name
      t.timestamps null: false
    end
  end
end
