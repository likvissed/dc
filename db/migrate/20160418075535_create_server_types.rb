class CreateServerTypes < ActiveRecord::Migration
  def change
    create_table :server_types do |t|
      t.string :name
      t.timestamps null: false
    end
  end
end
